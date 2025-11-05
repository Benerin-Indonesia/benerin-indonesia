<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;
use Throwable;
use Carbon\Carbon;

class PaymentController extends Controller
{
    public function __construct()
    {
        Config::$serverKey    = (string) config('services.midtrans.server_key');
        Config::$isProduction = (bool)   config('services.midtrans.is_production');
        Config::$isSanitized  = true;
        Config::$is3ds        = (bool)   config('services.midtrans.is_3ds');
    }

    public function paymentHandler(Request $request)
    {
        $request->validate(['id' => 'required|exists:service_requests,id']);
        $serviceRequest = ServiceRequest::findOrFail($request->id);

        $existingPayment = Payment::where('service_request_id', $serviceRequest->id)
            ->where('status', 'pending')
            ->where('created_at', '>', now()->subMinutes(15))
            ->latest()
            ->first();

        if ($existingPayment) {
            return Inertia::render('user/payment/show', [
                'snapToken'           => $existingPayment->snap_token,
                'serviceRequest'      => $serviceRequest,
                'midtrans_client_key' => config('services.midtrans.client_key'),
                'is_production'       => (bool) config('services.midtrans.is_production'),
                'payment' => [
                    'order_id' => $existingPayment->provider_ref,
                    'amount'   => (int) $existingPayment->amount,
                ],
            ]);
        }

        if ((int) $serviceRequest->accepted_price <= 0) {
            return back()->withErrors(['msg' => 'Nominal tidak valid.']);
        }

        try {
            $payment = DB::transaction(function () use ($serviceRequest) {
                $user    = $serviceRequest->user;
                $orderId = 'BR-' . $serviceRequest->id . '-' . now()->format('YmdHis');

                $payment = Payment::create([
                    'service_request_id' => $serviceRequest->id,
                    'user_id'            => $user->id,
                    'technician_id'      => $serviceRequest->technician_id,
                    'amount'             => (int) $serviceRequest->accepted_price,
                    'status'             => 'pending',
                    'provider'           => 'midtrans',
                    'provider_ref'       => $orderId,
                ]);

                $params = $this->buildMidtransParameters($payment, $serviceRequest);
                $resp   = Snap::createTransaction($params);

                $payment->update([
                    'snap_token'        => $resp->token,
                    'snap_redirect_url' => $resp->redirect_url,
                ]);

                return $payment;
            });

            return Inertia::render('user/payment/show', [
                'snapToken'           => $payment->snap_token,
                'serviceRequest'      => $serviceRequest,
                'midtrans_client_key' => config('services.midtrans.client_key'),
                'is_production'       => (bool) config('services.midtrans.is_production'),
                'payment' => [
                    'order_id' => $payment->provider_ref,
                    'amount'   => (int) $payment->amount,
                ],
            ]);
        } catch (Throwable $e) {
            Log::error('Gagal membuat sesi pembayaran', ['e' => $e->getMessage(), 'service_request_id' => $request->id]);
            return back()->withErrors(['msg' => 'Gagal memproses pembayaran.']);
        }
    }

    public function paymentSuccess(Request $request)
    {
        $payload = (array) $request->input('midtrans_response', []);
        $payment = Payment::where('provider_ref', $payload['order_id'] ?? null)->firstOrFail();

        $this->_handleSuccess($payment, $payload);

        return redirect()
            ->route('user.permintaan.show', $payment->service_request_id)
            ->with('success', 'Pembayaran berhasil dikonfirmasi.');
    }

    public function paymentPending(Request $request)
    {
        $payload = (array) $request->input('midtrans_response', []);
        $payment = Payment::where('provider_ref', $payload['order_id'] ?? null)->firstOrFail();

        $this->_handlePending($payment, $payload);

        return redirect()
            ->route('user.permintaan.show', $payment->service_request_id)
            ->with('info', 'Menunggu konfirmasi pembayaran Anda.');
    }

    public function paymentFail(Request $request)
    {
        $payload = (array) $request->input('midtrans_response', []);
        $payment = Payment::where('provider_ref', $payload['order_id'] ?? null)->firstOrFail();

        $this->_handleFailure($payment, $payload);

        return redirect()
            ->route('payment.show', ['id' => $payment->service_request_id])
            ->withErrors(['msg' => 'Pembayaran gagal atau dibatalkan.']);
    }

    public function webhookHandler(Request $request)
    {
        Log::info('midtrans:webhook:in', $request->all());

        try {
            $notification = new Notification();
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $payment = Payment::where('provider_ref', $notification->order_id)->first();
        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        $sig = hash('sha512',
            $notification->order_id .
            $notification->status_code .
            $notification->gross_amount .
            config('services.midtrans.server_key')
        );

        if (!hash_equals($sig, $notification->signature_key)) {
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        if (in_array($payment->status, ['settled', 'failure'], true)) {
            return response()->json(['message' => 'Already processed'], 200);
        }

        $payload = (array) $notification->getResponse();

        match ($notification->transaction_status) {
            'capture', 'settlement'    => $this->_handleSuccess($payment, $payload),
            'pending'                  => $this->_handlePending($payment, $payload),
            'deny', 'expire', 'cancel' => $this->_handleFailure($payment, $payload),
            default                    => Log::info("Webhook status {$notification->transaction_status} diabaikan."),
        };

        return response()->json(['message' => 'OK'], 200);
    }

    private function _handleSuccess(Payment $payment, array $payload): void
    {
        if ($payment->status === 'settled') return;

        $payment->update([
            'status'          => 'settled',
            'paid_at'         => Carbon::parse($payload['transaction_time'] ?? $payload['settlement_time'] ?? now()),
            'webhook_payload' => $payload,
        ]);

        Log::info("Payment settled: {$payment->provider_ref}");
    }

    private function _handlePending(Payment $payment, array $payload): void
    {
        $payment->update([
            'status'          => 'pending',
            'webhook_payload' => $payload,
        ]);

        Log::info("Payment pending: {$payment->provider_ref}");
    }

    private function _handleFailure(Payment $payment, array $payload): void
    {
        $payment->update([
            'status'          => 'failure',
            'webhook_payload' => $payload,
        ]);

        $payment->serviceRequest->update(['status' => 'dibatalkan']);
        Log::info("Payment failure: {$payment->provider_ref}");
    }

    private function buildMidtransParameters(Payment $payment, ServiceRequest $serviceRequest): array
    {
        return [
            'transaction_details' => [
                'order_id'     => $payment->provider_ref,
                'gross_amount' => (int) $payment->amount,
            ],
            'item_details' => [[
                'id'       => $serviceRequest->id,
                'price'    => (int) $payment->amount,
                'quantity' => 1,
                'name'     => 'Pembayaran untuk: ' . $serviceRequest->title,
            ]],
            'customer_details' => [
                'first_name' => $serviceRequest->user->name,
                'email'      => $serviceRequest->user->email,
                'phone'      => $serviceRequest->user->phone,
            ],
        ];
    }
}

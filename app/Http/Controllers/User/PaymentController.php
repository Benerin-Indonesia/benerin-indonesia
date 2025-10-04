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
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;
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
                'snapToken' => $existingPayment->snap_token,
                'serviceRequest' => $serviceRequest,
                'midtrans_client_key' => config('services.midtrans.client_key'),
                'payment' => [
                    'order_id' => $existingPayment->provider_ref,
                    'amount'   => $existingPayment->amount,
                ]
            ]);
        }

        try {
            $payment = DB::transaction(function () use ($serviceRequest) {
                $user = $serviceRequest->user;
                $orderId = 'BR-' . $serviceRequest->id . '-' . now()->format('Ymd-His');
                $payment = Payment::create([
                    'service_request_id' => $serviceRequest->id,
                    'user_id' => $user->id,
                    'technician_id' => $serviceRequest->technician_id,
                    'amount' => $serviceRequest->accepted_price,
                    'status' => 'pending',
                    'provider' => 'midtrans',
                    'provider_ref' => $orderId,
                ]);
                $params = $this->buildMidtransParameters($payment, $serviceRequest);
                $midtransResponse = Snap::createTransaction($params);
                $payment->update([
                    'snap_token' => $midtransResponse->token,
                    'snap_redirect_url' => $midtransResponse->redirect_url,
                ]);
                return $payment;
            });

            return Inertia::render('user/payment/show', [
                'snapToken' => $payment->snap_token,
                'serviceRequest' => $serviceRequest,
                'midtrans_client_key' => config('services.midtrans.client_key'),
                'payment' => [
                    'order_id' => $payment->provider_ref,
                    'amount' => $payment->amount,
                ]
            ]);
        } catch (Throwable $e) {
            Log::error('Gagal membuat sesi pembayaran: ' . $e->getMessage(), ['request_id' => $request->id]);
            return redirect()->back()->withErrors(['msg' => 'Gagal memproses pembayaran.']);
        }
    }

    // --- METODE PUBLIK
    public function paymentSuccess(Request $request)
    {
        $payload = $request->input('midtrans_response');
        $payment = Payment::where('provider_ref', $payload['order_id'])->firstOrFail();

        // Panggil fungsi inti untuk handle logika sukses
        $this->_handleSuccess($payment, $payload);

        return redirect()->route('user.permintaan.show', $payment->service_request_id)
            ->with('success', 'Pembayaran Anda telah berhasil dikonfirmasi!');
    }

    public function paymentPending(Request $request)
    {
        $payload = $request->input('midtrans_response');
        $payment = Payment::where('provider_ref', $payload['order_id'])->firstOrFail();

        // Panggil fungsi inti untuk handle logika pending
        $this->_handlePending($payment, $payload);

        return redirect()->route('user.permintaan.show', $payment->service_request_id)
            ->with('info', 'Kami menunggu konfirmasi pembayaran Anda.');
    }

    public function paymentFail(Request $request)
    {
        $payload = $request->input('midtrans_response');
        $payment = Payment::where('provider_ref', $payload['order_id'])->firstOrFail();

        // Panggil fungsi inti untuk handle logika gagal
        $this->_handleFailure($payment, $payload);

        return redirect()->route('payment.show', ['id' => $payment->service_request_id])
            ->withErrors(['msg' => 'Pembayaran gagal atau dibatalkan. Silakan coba lagi.']);
    }

    // --- WEBHOOK HANDLER
    public function webhookHandler(Request $request)
    {
        Log::info('Webhook Midtrans Diterima!', $request->all());

        try {
            $notification = new Notification();
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $orderId = $notification->order_id;
        $payment = Payment::where('provider_ref', $orderId)->first();

        // Lakukan validasi signature & pastikan payment ditemukan
        // ... (kode validasi Anda sudah bagus)

        $signatureKey = hash('sha512', $orderId . $notification->status_code . $notification->gross_amount . config('services.midtrans.server_key'));
        if ($notification->signature_key !== $signatureKey) {
            return response()->json(['error' => 'Invalid signature'], 403);
        }
        if (!$payment) {
            return response()->json(['message' => 'Payment not found.'], 404);
        }
        if ($payment->status === 'settled' || $payment->status === 'failure') {
            return response()->json(['message' => 'Transaction already processed.'], 200);
        }

        // Ambil payload dari notifikasi webhook
        $payload = (array) $notification->getResponse();

        // Gunakan match statement untuk memanggil fungsi inti yang sesuai
        match ($notification->transaction_status) {
            'capture', 'settlement' => $this->_handleSuccess($payment, $payload),
            'pending' => $this->_handlePending($payment, $payload),
            'deny', 'expire', 'cancel' => $this->_handleFailure($payment, $payload),
            // Anda bisa menambahkan _handleRefund jika perlu
            default => Log::info("Webhook status {$notification->transaction_status} tidak ditangani."),
        };

        return response()->json(['message' => 'Webhook berhasil.'], 200);
    }



    // --- PRIVATE METHODS
    private function _handleSuccess(Payment $payment, array $payload): void
    {
        // Cek untuk menghindari double-processing
        if ($payment->status === 'settled') return;

        $payment->update([
            'status' => 'settled',
            'paid_at' => Carbon::parse($payload['transaction_time'] ?? $payload['settlement_time'] ?? now()),
            'webhook_payload' => $payload,
        ]);
        Log::info("Pembayaran SUKSES untuk Order ID: {$payment->provider_ref}");
    }

    private function _handlePending(Payment $payment, array $payload): void
    {
        $payment->update([
            'status' => 'pending',
            'webhook_payload' => $payload,
        ]);
        Log::info("Pembayaran PENDING untuk Order ID: {$payment->provider_ref}");
    }

    private function _handleFailure(Payment $payment, array $payload): void
    {
        $payment->update([
            'status' => 'failure',
            'webhook_payload' => $payload,
        ]);
        // Kembalikan status ke 'diproses' agar user bisa mencoba bayar lagi
        $payment->serviceRequest->update(['status' => 'dibatalkan']);
        Log::info("Pembayaran GAGAL untuk Order ID: {$payment->provider_ref}");
    }

    // Metode buildMidtransParameters tidak berubah
    private function buildMidtransParameters(Payment $payment, ServiceRequest $serviceRequest): array
    {
        return [
            'transaction_details' => [
                'order_id' => $payment->provider_ref,
                'gross_amount' => $payment->amount,
            ],
            'item_details' => [
                [
                    'id' => $serviceRequest->id,
                    'price' => $payment->amount,
                    'quantity' => 1,
                    'name' => 'Pembayaran untuk: ' . $serviceRequest->title,
                ],
            ],
            'customer_details' => [
                'first_name' => $serviceRequest->user->name,
                'email' => $serviceRequest->user->email,
                'phone' => $serviceRequest->user->phone,
            ],
        ];
    }
}

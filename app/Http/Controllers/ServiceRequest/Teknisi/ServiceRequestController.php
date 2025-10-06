<?php

namespace App\Http\Controllers\ServiceRequest\Teknisi;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ServiceRequest;
use Inertia\Inertia;
use App\Models\Payment;
use App\Models\RequestPhoto;
use Illuminate\Support\Facades\Auth;

class ServiceRequestController extends Controller
{
    /**
     * Menampilkan service secara detail untuk teknisi.
     */
    public function show(Request $request)
    {
        // Mencari ServiceRequest berdasarkan ID, TAPI hanya untuk teknisi yang sedang login.
        $serviceRequest = ServiceRequest::with(['messages.sender', 'user'])
            ->where('technician_id', Auth::id()) // <-- Penambahan Keamanan
            ->findOrFail($request->id);

        // Baris-baris di bawah ini tetap sama, hanya sumber datanya lebih efisien.
        $payment = Payment::where('service_request_id', $serviceRequest->id)
            ->latest()
            ->first();

        $requestPhotoPath = RequestPhoto::where('service_request_id', $serviceRequest->id)->first();
        // dd($requestPhotoPath->path);

        $paymentStatus = $payment ? $payment->status : false;

        $needsPaymentAction = !($payment && $payment->status === 'settled');

        $messages = $serviceRequest->messages;

        return Inertia::render('teknisi/request-service/show', [
            'request' => $serviceRequest,
            'paymentStatus' => $paymentStatus,
            'requestPhotoPath' => $requestPhotoPath->path ?? null,
            'needsPaymentAction' => $needsPaymentAction,
            'initialMessages' => $messages,
        ]);
    }

    public function createPrice(Request $request)
    {
        $request->validate([
            'request_id' => 'required|exists:service_requests,id',
            'price_offer' => 'required|numeric|min:0',
        ]);

        $serviceRequest = ServiceRequest::find($request->request_id);

        if (!$serviceRequest) {
            return redirect()->back()->withErrors(['error' => 'Service request not found.']);
        }

        if ($serviceRequest->status == "menunggu") {
            $serviceRequest->accepted_price = $request->price_offer;
            $serviceRequest->status = 'menunggu'; // Update status to 'diproses'
            $serviceRequest->save();

            return redirect()->back()->with('success', 'Price offer submitted successfully.');
        } else {
            return redirect()->back()->with('gagal', 'sesi penawaran telah berakir');
        }
    }
}

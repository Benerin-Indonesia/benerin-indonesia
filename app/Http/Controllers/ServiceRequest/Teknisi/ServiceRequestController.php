<?php

namespace App\Http\Controllers\ServiceRequest\Teknisi;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ServiceRequest;
use Inertia\Inertia;
use App\Models\Payment;

class ServiceRequestController extends Controller
{
    /**
     * Menampilkan service secara detail
     */
    public function show(Request $request)
    {
        // Baris ini tidak diubah. Setelah baris ini, variabel $request berisi model ServiceRequest.
        $request = ServiceRequest::findorFail($request->id);

        // 1. Ambil record payment berdasarkan payment_id yang ada di service request.
        $payment = Payment::where('service_request_id', $request->id)->first();

        // 2. Dapatkan statusnya. Jika payment tidak ditemukan (masih null), beri status default.
        $paymentStatus = $payment ? $payment->status : false;
        
        // 3. Buat kesimpulan boolean: true jika status BUKAN 'settled'.
        $needsPaymentAction = ($paymentStatus !== 'settled');

        return Inertia::render('teknisi/request-service/show', [
            'request' => $request,
            'paymentStatus' => $paymentStatus,
            'needsPaymentAction' => $needsPaymentAction,
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

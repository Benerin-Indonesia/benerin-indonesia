<?php

namespace App\Http\Controllers\ServiceRequest\Teknisi;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ServiceRequest;
use Inertia\Inertia;

class ServiceRequestController extends Controller
{
    function show(Request $request)
    {
        $service = ServiceRequest::findOrFail($request->id);
        // dd($service);
        return Inertia::render('teknisi/request-service/show', [
            'request' => $service,
        ]);
    }

    public function createPrice(Request $request)
    {
        $request->validate([
            'request_id' => 'required|exists:service_requests,id',
            'offer_price' => 'required|numeric|min:0',
        ]);

        $serviceRequest = ServiceRequest::find($request->request_id);
        if (!$serviceRequest) {
            return redirect()->back()->withErrors(['error' => 'Service request not found.']);
        }

        if ($serviceRequest->status == "menunggu") {
            $serviceRequest->accepted_price = $request->offer_price;
            $serviceRequest->status = 'menunggu'; // Update status to 'diproses'
            $serviceRequest->save();

            return redirect()->back()->with('success', 'Price offer submitted successfully.');
        } else {
            return redirect()->back()->with('gagal', 'sesi penawaran telah berakir');
        }
    }
}

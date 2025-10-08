<?php

namespace App\Http\Controllers\ServiceRequest\Teknisi;

use App\Http\Controllers\Controller;
use App\Models\Balance;
use Illuminate\Http\Request;
use App\Models\ServiceRequest;
use Inertia\Inertia;
use App\Models\Payment;
use App\Models\RequestPhoto;
use Illuminate\Support\Facades\Auth;
use App\Models\TechnicianService;
use Carbon\Carbon;

class ServiceRequestController extends Controller
{

    public function index(Request $request)
    {
        $technician = Auth::user();
        if (!$technician || $technician->role !== 'teknisi') abort(403);

        $technician_id = $technician->id;

        // Statistik tetap sama, tidak terpengaruh filter
        $tasks = [
            'today' => ServiceRequest::where('technician_id', $technician_id)
                ->where('status', 'menunggu')
                ->count(),
            'in_progress' => ServiceRequest::where('technician_id', $technician_id)
                ->where('status', 'dijadwalkan')
                ->count(),
            'revenue_today' => Balance::where('owner_id', $technician_id)
                ->whereIn('type', ['escrow_release', 'paid', 'payout_request'])
                ->sum('amount')
        ];

        // --- [MODIFIKASI] --- Query builder untuk menerapkan filter secara dinamis
        $query = ServiceRequest::where('technician_id', $technician_id)
            ->orderBy('created_at', 'desc');

        // Terapkan filter berdasarkan input dari request
        $query->when($request->input('search'), function ($q, $search) {
            $q->where('title', 'like', "%{$search}%");
        });

        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        $query->when($request->input('tanggal_mulai'), function ($q, $date) {
            $q->whereDate('scheduled_for', $date);
        });

        // Ambil hasil dengan paginasi (misal: 9 item per halaman)
        // withQueryString() penting agar link paginasi tetap membawa parameter filter
        $job_items = $query->paginate()->withQueryString()->through(function ($req) {
            $price = $req->status === 'selesai' ? $req->accepted_price : $req->price_offer;
            return [
                'id' => $req->id,
                'title' => $req->title ?? 'Pekerjaan Tanpa Judul',
                'category' => $req->category ?? '-',
                'description' => $req->description ?? '',
                'scheduled_for' => $req->scheduled_for
                    ? \Carbon\Carbon::parse($req->scheduled_for)->toDateTimeString()
                    : null,
                'status' => $req->status,
                'price_offer' => $price,
            ];
        });

        return Inertia::render('teknisi/request-service/index', [
            'stats' => $tasks,
            'incoming' => $job_items, // Data sekarang berisi 'data', 'links', 'meta', dll.
            'filters' => $request->only(['search', 'status', 'tanggal_mulai']), // Kirim kembali filter ke frontend
        ]);
    }

    // In your Technician Controller

    public function indexJadwal()
    {
        $technician = Auth::user();
        if (!$technician || $technician->role !== 'teknisi') {
            abort(403, 'Hanya teknisi yang dapat mengakses halaman ini.');
        }

        $technician_id = $technician->id;

        $scheduledJobs = ServiceRequest::where('technician_id', $technician_id)
            ->where('status', 'dijadwalkan')
            ->whereExists(function ($query) {
                $query->from('payments')
                    ->whereColumn('payments.service_request_id', 'service_requests.id')
                    ->where('status', 'settled');
            })
            // --- [PERBAIKAN] --- Ambil juga address dari user
            ->with('user:id,name')
            ->orderBy('scheduled_for', 'asc')
            ->get();

        $groupedJobs = $scheduledJobs->groupBy(function ($job) {
            return \Carbon\Carbon::parse($job->scheduled_for)->format('Y-m-d');
        })->map(function ($jobsOnDate) {
            return $jobsOnDate->map(function ($job) {
                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'scheduled_for' => $job->scheduled_for->toDateTimeString(),
                    'price_offer' => $job->accepted_price, // <-- DATA HARGA DITAMBAHKAN
                    'category' => $job->category,       // <-- DATA KATEGORI DITAMBAHKAN
                    'user' => $job->user,               // <-- Data user sudah berisi address
                ];
            });
        });

        return Inertia::render('teknisi/request-service/index-jadwal', [
            'scheduledJobs' => $groupedJobs,
        ]);
    }

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

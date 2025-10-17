<?php

namespace App\Http\Controllers\Chat;

use App\Events\NewChatMessage;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChatMessageController extends Controller
{
    /**
     * Menyimpan pesan baru dan menyiarkannya.
     */
    public function store(Request $request, ServiceRequest $serviceRequest)
    {
        // Otorisasi
        if (Auth::id() !== $serviceRequest->user_id && Auth::id() !== $serviceRequest->technician_id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate(['body' => 'required|string|max:2000']);

        try {
            $message = $serviceRequest->messages()->create([
                'sender_id' => Auth::id(),
                'type' => 'text',
                'body' => $validated['body'],
            ]);

            $message->load('sender');

            Log::info('BROADCAST MASUK UNTUK ORDER ID: ' . $message->service_request_id);

            broadcast(new NewChatMessage($message))->toOthers();

            return response()->json($message, 201);
        } catch (\Exception $e) {
            Log::error("Gagal menyimpan atau broadcast pesan untuk SR ID {$serviceRequest->id}: " . $e->getMessage());
            return response()->json(['message' => 'Gagal memproses pesan di server.'], 500);
        }
    }
}

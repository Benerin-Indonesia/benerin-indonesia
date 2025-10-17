<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\ServiceRequest;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{serviceRequestId}', function ($user, $serviceRequestId) {
    $serviceRequest = ServiceRequest::find($serviceRequestId);
    if ($serviceRequest) {

        return $user->id === $serviceRequest->user_id || $user->id === $serviceRequest->technician_id;
    }
    return false;
});
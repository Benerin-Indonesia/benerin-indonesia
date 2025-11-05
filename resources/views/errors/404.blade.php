@extends('errors.layout')

@section('code','404')
@section('title','Halaman tidak ditemukan')
@section('message','Maaf, halaman ini tidak dapat dibuka atau sudah dipindahkan.')

@section('extra-actions')
  <a class="btn btn-secondary" href="/user/permintaan/buat">Buat Permintaan Servis</a>
@endsection

@section('help')
  Coba periksa alamat tautan atau kembali ke halaman utama.
@endsection

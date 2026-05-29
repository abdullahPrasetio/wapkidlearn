export default function LockedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="text-7xl mb-6">🔒</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Akses Dikunci</h1>
      <p className="text-gray-500 text-base leading-relaxed">
        Orang tuamu sedang mengunci akses sementara.
        <br />
        Hubungi orang tuamu untuk membuka kunci.
      </p>
    </div>
  )
}

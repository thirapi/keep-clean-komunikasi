export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-full">
            <h1 className="text-3xl font-bold">403 - Unauthorized</h1>
            <p className="text-gray-600 mt-2">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
    );
}
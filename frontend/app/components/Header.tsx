export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FHE Auction</h1>
          </div>
          <p className="text-sm text-gray-600">
            Sealed-bid auctions with FHE confidentiality
          </p>
        </div>
      </div>
    </header>
  )
}

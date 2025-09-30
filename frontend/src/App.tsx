import "./App.css";

function App() {
  return (
    <div className="h-screen flex flex-col">
      {/* Nav */}
      <nav className="h-14 bg-gray-800 text-white flex items-center px-4">
        <h1 className="text-lg font-semibold">GenomeVis Project</h1>
      </nav>

      {/* 3D Panel */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-600">3D Panel</span>
      </div>

      {/* 2D Panel */}
      <div className="flex-1 bg-white flex items-center justify-center">
        <span className="text-gray-600">2D Panel</span>
      </div>
    </div>
  );
}

export default App;

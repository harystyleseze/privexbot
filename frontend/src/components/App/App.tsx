import { Button } from "@/components/ui/button"

function App() {
  return (
      <>
          <div className="p-4 bg-blue-200 rounded-lg text-center flex items-center justify-center gap-3">
              <img src="/logo.png" alt="PrivexBot Logo" className="h-12 w-auto" />
              <h1 className="text-2xl font-semibold">Privexbot AI chatbot builder</h1>
          </div>
          <div className="flex min-h-svh flex-col items-center justify-center">
              <Button>Click me</Button>
          </div>
      </>
  )
}

export default App

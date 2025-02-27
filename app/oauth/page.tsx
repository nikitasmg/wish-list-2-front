import { useParams } from 'next/navigation'

export default function LoginPage() {
  const params = useParams()
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div>
        {JSON.stringify(params, null, 2)}
      </div>
    </div>
  )
}

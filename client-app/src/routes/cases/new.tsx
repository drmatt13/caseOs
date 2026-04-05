import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cases/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/cases/new"!</div>
}

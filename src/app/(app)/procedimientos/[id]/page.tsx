import { redirect } from "next/navigation";

export default async function PaginaProcedimiento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/procedimientos/${id}/funcionario`);
}

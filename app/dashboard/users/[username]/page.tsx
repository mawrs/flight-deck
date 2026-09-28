import { UserDetail } from "../UserDetail";

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <UserDetail key={username} username={decodeURIComponent(username)} />;
}

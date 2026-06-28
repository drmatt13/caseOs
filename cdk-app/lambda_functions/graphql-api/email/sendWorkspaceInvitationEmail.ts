// Workspace invitation email dispatch.
//
// For now this only simulates the send via a structured console.log so the rest
// of the invitation flow (persistence, accept/decline, badges) can be built and
// tested end-to-end. Swapping in a real Resend call later is a one-liner inside
// the TODO below — RESEND_API_KEY is already wired into the Lambda environment
// (see cdk-app/lib/synchronous-lambda-functions-stack.ts).

export type WorkspaceInvitationEmailInput = {
  email: string;
  workspaceName: string;
  inviterName: string | null;
  role: string;
  invitationToken: string;
};

export async function sendWorkspaceInvitationEmail(
  input: WorkspaceInvitationEmailInput,
): Promise<void> {
  // TODO: send via Resend using process.env.RESEND_API_KEY, e.g.
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ to: input.email, from: ..., subject: ..., html: ... });
  // The acceptance link would embed input.invitationToken.
  console.log("[invitation email — simulated]", {
    to: input.email,
    workspace: input.workspaceName,
    invitedBy: input.inviterName ?? "a workspace member",
    role: input.role,
    tokenPreview: `${input.invitationToken.slice(0, 8)}…`,
  });
}

import { NextResponse } from "next/server";

/**
 * WebFinger endpoint implementation
 * Specification: https://webfinger.net/
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");

  if (!resource) {
    return NextResponse.json({ error: "Missing resource parameter" }, { status: 400 });
  }

  // Expecting resource format: acct:username@domain.com
  const match = resource.match(/^acct:([^@]+)@(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Invalid resource format" }, { status: 400 });
  }

  const username = match[1];
  const domain = match[2];

  // In a real implementation, we would verify the user exists in our database
  // For now, we return a successful response to demonstrate readiness
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${domain}`;

  return NextResponse.json({
    subject: resource,
    links: [
      {
        rel: "http://webfinger.net/rel/profile-page",
        type: "text/html",
        href: `${baseUrl}/profile/${username}`
      },
      {
        rel: "self",
        type: "application/activity+json",
        href: `${baseUrl}/api/users/${username}`
      }
    ]
  }, {
    headers: {
      "Content-Type": "application/jrd+json"
    }
  });
}

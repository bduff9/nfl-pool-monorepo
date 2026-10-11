export const htmlResponse = (body: string, status: number): Response =>
  new Response(body, {
    headers: {
      "Content-Type": "text/html",
    },
    status,
  });

const isSignedLink = (
  email: string,
  token: FormDataEntryValue | null,
  verifyLink: (email: string, token: string) => boolean,
): boolean => typeof token === "string" && verifyLink(email, token);

// Only links signed by the email pipeline may unsubscribe an address, so a third party
// can't opt someone else out by email alone. Returns the email to unsubscribe, or the rejection response.
export const parseUnsubscribeForm = (
  formData: FormData,
  verifyLink: (email: string, token: string) => boolean,
): Response | string => {
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return htmlResponse("<h1>Please provide a valid email address</h1>", 400);
  }

  if (!isSignedLink(email, formData.get("t"), verifyLink)) {
    return htmlResponse("<h1>Please use the unsubscribe link from your email</h1>", 403);
  }

  return email;
};

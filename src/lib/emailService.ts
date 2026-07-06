/**
 * Transactional Email Dispatcher Service
 * Placeholder for sending emails from @cardinalsystems.org
 */
export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: EmailPayload): Promise<void> {
  // Format log statement for easy debugging and future integration
  console.log(`
========================================================================
[EMAIL SERVICE DISPATCH]
Sender: noreply@cardinalsystems.org (Future Host)
Recipient: ${to}
Subject: ${subject}
------------------------------------------------------------------------
${body}
========================================================================
  `);

  // Simulated Delay for dispatching
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Future backend API integration:
  // const response = await fetch('https://api.cardinalsystems.org/v1/send-email', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ to, subject, body })
  // });
  // if (!response.ok) throw new Error('Failed to dispatch transactional email.');
}

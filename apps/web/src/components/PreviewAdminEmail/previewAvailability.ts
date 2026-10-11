type PreviewAvailability = {
  canPreview: boolean;
  canPreviewHtml: boolean;
  canPreviewSubject: boolean;
  canPreviewText: boolean;
};

export const getPreviewAvailability = ({
  body,
  preview,
  subject,
}: {
  body: string;
  preview: string;
  subject: string;
}): PreviewAvailability => {
  const canPreviewSubject = Boolean(subject);
  const canPreviewText = Boolean(body);

  return {
    // Every field is required for the HTML preview, so any field implies at least one of the other two.
    canPreview: canPreviewSubject || canPreviewText,
    canPreviewHtml: Boolean(body && subject && preview),
    canPreviewSubject,
    canPreviewText,
  };
};

'use client';

/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { type FC, useEffect, useRef } from 'react';

import "quill/dist/quill.bubble.css";

import { AdminEmailTo, AdminEmailType } from '@/lib/constants';
import { sendAdminEmailSchema } from '@/lib/zod';
import { processFormErrors, processFormState } from '@/lib/zsa';
import { sendAdminEmail } from '@/server/actions/email';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@nfl-pool-monorepo/ui/components/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@nfl-pool-monorepo/ui/components/form';
import { Input } from '@nfl-pool-monorepo/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nfl-pool-monorepo/ui/components/select';
import { cn } from '@nfl-pool-monorepo/utils/styles';
import { useForm, useWatch } from 'react-hook-form';
import { PiFootballDuotone } from 'react-icons/pi';
import { useQuill } from 'react-quilljs';
import { toast } from 'sonner';
import { z } from 'zod';
import PreviewAdminEmail from '../PreviewAdminEmail/PreviewAdminEmail';

const quillModules = {
	clipboard: {
		// toggle to add extra line breaks when pasting HTML:
		matchVisual: false,
	},
	toolbar: [
		['bold', 'italic', 'underline', 'strike'], // toggled buttons
		['blockquote', 'code-block', 'code'],

		// [{ header: 1 }, { header: 2 }], // custom button values
		[{ list: 'ordered' }, { list: 'bullet' }],
		[{ script: 'sub' }, { script: 'super' }], // superscript/subscript
		[{ indent: '-1' }, { indent: '+1' }], // outdent/indent
		[{ direction: 'rtl' }], // text direction

		[{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
		[{ header: [1, 2, 3, 4, 5, 6, false] }],

		[{ color: [] }, { background: [] }], // dropdown with defaults from theme
		[{ font: [] }],
		[{ align: [] }],

		['clean'], // remove formatting button
	],
};

const quillFormats = [
	'align',
	'background',
	'blockquote',
	'bold',
	'code',
	'code-block',
	'color',
	'direction',
	'font',
	'header',
	'image',
	'indent',
	'italic',
	'link',
	'list',
	'script',
	'size',
	'strike',
	'underline',
	'video',
];

const SendAdminEmails: FC = () => {
	const form = useForm<z.infer<typeof sendAdminEmailSchema>>({
		defaultValues: {
			body: '',
			preview: '',
			subject: '',
			userEmail: null,
			userFirstName: null,
		},
		resolver: zodResolver(sendAdminEmailSchema),
	});
	const emailType = useWatch({ control: form.control, name: 'emailType' });
	const sendTo = useWatch({ control: form.control, name: 'sendTo' });
	const subject = useWatch({ control: form.control, name: 'subject' });
	const preview = useWatch({ control: form.control, name: 'preview' });
	const body = useWatch({ control: form.control, name: 'body' });
	const userFirstName = useWatch({ control: form.control, name: 'userFirstName' });
	const previewPayload = useRef({ body, preview, subject });
	const { quill, quillRef } = useQuill({ bounds: '#quill-container', formats: quillFormats, modules: quillModules, placeholder: 'Intriguing email content', theme: 'bubble' });

	useEffect(() => {
		if (quill) {
			quill.on('text-change', () => {
				form.setValue('body', quill.root.innerHTML);
			});
		}

		return () => {
			if (quill) {
				quill.off('text-change');
			}
		};
	}, [quill, form.setValue]);

	const updatePreview = async (): Promise<void> => {
		previewPayload.current = {
			body,
			preview,
			subject,
		};
	};

	const onSubmit = async (values: z.infer<typeof sendAdminEmailSchema>): Promise<void> => {
		const toastId = toast.loading("Sending email...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    const result = await sendAdminEmail(values);

    processFormState(
      result,
      () => {
        form.reset();
      },
      `Successfully sent email!`,
    );
    toast.dismiss(toastId);
	};

	return (
		<div className="flex flex-col" id="quill-container">
			<div className="w-full bg-gray-100/80 text-black p-4 border rounded">
				<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-center mb-6">Send Email</h1>

				<Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="emailType"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="required">Which email?</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={cn("dark:bg-white w-full", fieldState.error && "border-red-600")}>
                      <SelectValue placeholder="-- Select an email type --" />
										</SelectTrigger>
										<SelectContent>
											{AdminEmailType.map((emailType) => (
												<SelectItem key={`email-type-${emailType}`} value={emailType}>
													{emailType}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
            )}
          />

					<FormField
            control={form.control}
            name="sendTo"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="required">Send to</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={cn("dark:bg-white w-full", fieldState.error && "border-red-600")}>
                      <SelectValue placeholder="-- Select send to group --" />
										</SelectTrigger>
										<SelectContent>
											{AdminEmailTo.map((sendTo) => (
												<SelectItem key={`send-to-${sendTo}`} value={sendTo}>
													{sendTo}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
            )}
          />

					{sendTo === 'New' && (
						<>
						<FormField
            control={form.control}
            name="userEmail"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="required">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-invalid={!!fieldState.error}
                    autoComplete="off"
                    className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                    id="userEmail"
                    placeholder="someone@email.com"
                    type="email"
										value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

					<FormField
            control={form.control}
            name="userFirstName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="required">First name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-invalid={!!fieldState.error}
                    autoComplete="off"
                    className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                    id="userFirstName"
                    placeholder="John"
                    type="text"
										value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
						</>
					)}

					{emailType === 'Custom' && (
						<>
						<div className="grid">
						<FormField
					control={form.control}
					name="subject"
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel className="required">Subject</FormLabel>
							<FormControl>
								<Input
									{...field}
									aria-invalid={!!fieldState.error}
									autoComplete="off"
									className={cn("dark:bg-white", fieldState.error && "border-red-600")}
									onBlur={updatePreview}
									placeholder="Interesting email subject"
									type="text"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

<FormField
            control={form.control}
            name="preview"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="required">Preview</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-invalid={!!fieldState.error}
                    autoComplete="off"
                    className={cn("dark:bg-white", fieldState.error && "border-red-600")}
										onBlur={updatePreview}
                    placeholder="Helpful email preview text"
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

<FormField
            control={form.control}
            name="body"
            render={({ fieldState }) => (
              <FormItem className="mt-3">
                <FormLabel className="required">Body</FormLabel>
                <FormControl>
									<div className={cn('bg-white border rounded-md w-full min-h-10', fieldState.error && 'border-red-600')}>
										<div ref={quillRef} onBlur={updatePreview} />
									</div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
						</div>

					<PreviewAdminEmail
						emailType={emailType}
						payload={previewPayload.current}
						userFirstName={userFirstName ?? 'USER'}
					/>
						</>
					)}

					<div className="w-full md:col-span-2 grid">
						<Button
							disabled={form.formState.isSubmitting}
							type="submit"
							variant="primary"
						>
							{form.formState.isSubmitting ? (
								<>
									<PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
									Sending...
								</>
							) : (
								'Send Email'
							)}
						</Button>
					</div>
				</div>
				</form>
			</Form>
			</div>
		</div>
	);
};

export default SendAdminEmails;

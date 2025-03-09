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
import { useRouter } from 'next/navigation';
import { useRef, type FC } from 'react';
import { debounce } from 'throttle-debounce';

type Props = {
	currentQuery: string;
};

const SupportSearch: FC<Props> = ({ currentQuery }) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const q = inputRef.current?.value ?? '';
		const url = `/support${q ? `?q=${encodeURIComponent(q)}` : ''}`;

		router.push(url);
	};

	const search = debounce(750, handleSubmit);

	return (
		<form onChange={search} onSubmit={handleSubmit}>
			<div className="form-floating mb-2">
				<input
					autoComplete="off"
					autoFocus
					className="form-control"
					defaultValue={currentQuery}
					id="q"
					key="search"
					name="q"
					placeholder="Search the help page"
					ref={inputRef}
					title="Search the help page"
					type="search"
				/>
				<label htmlFor="search">Search the help page</label>
			</div>
			<button className="d-none" type="submit">
				Search
			</button>
		</form>
	);
};

// ts-prune-ignore-next
export default SupportSearch;

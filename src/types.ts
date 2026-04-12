type CreditName =
	| { name: string; instagram_handle?: never }
	| { instagram_handle: string; name?: never };

interface Credit {
	role: string;
	names: CreditName[];
}

export interface Project {
	title: string;
	year: number;
	order: number;
	thumbnail: string;
	preview: string;
	videoUrl: string | null;
	credits: Credit[];
}

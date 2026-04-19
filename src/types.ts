interface CreditName {
	name?: string;
	instagram_handle?: string;
}

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
	videoUrl?: string;
	credits: Credit[];
}

export interface Illustration {
  _id: string;
  title: string;
  newSlug: string;
  media: string;
}

export interface Catalog {
  buildId: string;
  fetchedAt: number;
  illustrations: Illustration[];
}

export interface NextDataPageProps {
  illustrations?: Illustration[];
  currentPage?: number;
  totalPages?: number;
}

export interface NextData {
  buildId: string;
  props: {
    pageProps: NextDataPageProps;
  };
}

/** Narrow generated insert/update types fail on this client; writes use an explicit escape. */
export function writable<T>(query: T) {
  return query as unknown as {
    insert: (values: unknown) => PromiseLike<{ error: { message: string } | null }> & {
      select: (columns: string) => {
        single: () => PromiseLike<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
    update: (values: unknown) => {
      eq: (column: string, value: string) => WritableFilter;
    };
    delete: () => {
      eq: (column: string, value: string) => WritableFilter;
    };
  };
}

interface WritableFilter {
  eq: (column: string, value: string) => WritableFilter;
  in: (column: string, values: string[]) => PromiseLike<{ error: { message: string } | null }>;
  then: PromiseLike<{ error: { message: string } | null }>["then"];
}

import { parse } from 'https://deno.land/x/xml@v1.0.2/parse.ts';

type TResult = {
  toplevel: {
    CompleteSuggestion?: {
      suggestion: {
        '@data': string;
      };
    }[];
  };
}

type TAlfredResultProps = {
  arg?: string;
  copy?: string;
  icon?: string;
  largetype?: string;
  subtitle?: string;
  title: string;
  valid?: boolean;
}

const getGoogleSearchUrl = (query: string): string => (
  `https://www.google.com/search?q=${query}`
);

const getGoogleSuggestionsApi = (query: string): string => (
  `https://suggestqueries.google.com/complete/search?output=toolbar&q=${query}`
);


const getAlfredResult = (props: TAlfredResultProps) => ({
  title: props.title,
  ...props?.subtitle && {
    subtitle: props?.subtitle,
  },
  ...props?.arg && {
    arg: props?.arg,
  },
  icon: {
    path: props?.icon || 'icons/google.png',
  },
  text: {
    copy: props?.copy || props?.arg || '',
    largetype: props?.largetype || props?.arg || '',
  },
  valid: props?.valid,
});

try {
  const query = Deno.args[0] || '';

  const res = await fetch(getGoogleSuggestionsApi(query));
  const body: TResult = await parse(await res.text()) as TResult;

  const packages = {
    items: [
      ...(body.toplevel?.CompleteSuggestion?.length
        ? [
          ...body.toplevel.CompleteSuggestion.map((item) => (
            getAlfredResult({
              title: item.suggestion['@data'],
              arg: getGoogleSearchUrl(item.suggestion['@data']),
            })
          )),
        ]
        : [
          getAlfredResult({
            title: `No suggestions were found for "${query}"`,
            valid: false,
          }),
        ]),
    ],
  };

  console.log(JSON.stringify(packages));
} catch (error) {
  console.log(
    JSON.stringify({
      items: [
        getAlfredResult({
          title: error.name,
          subtitle: error.message,
          copy: error.stack,
          valid: false,
        }),
      ],
    }),
  );
}

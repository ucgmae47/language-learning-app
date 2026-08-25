import { StoryReaderClient } from "@/components/stories/story-reader-client";
import { isTtsEnabled } from "@/lib/features/tts";
import type { Language } from "@/lib/supabase/types";

type Translations = {
  sentences: string[];
  words: Record<string, string>;
};

type Props = {
  title: string;
  cefrLevel: string;
  language: Language;
  topics: string[];
  readingMins: number | null;
  body: string;
  translations: Translations | null;
  storyId: string;
  attemptScore: number | null;
  initialSentenceIndex?: number;
  initialFinished?: boolean;
};

/** Thin server wrapper — all UI lives in StoryReaderClient → StoryReader. */
export function StoryPageShell(props: Props) {
  return (
    <StoryReaderClient
      {...props}
      initialTranslations={props.translations}
      initialSentenceIndex={props.initialSentenceIndex}
      initialFinished={props.initialFinished}
      ttsEnabled={isTtsEnabled()}
    />
  );
}

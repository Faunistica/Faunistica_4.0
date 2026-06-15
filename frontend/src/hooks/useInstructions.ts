import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export interface Section {
    id: string;
    title: string;
    content: string;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function parseSections(markdown: string): Section[] {
    const lines = markdown.split('\n');
    const sections: Section[] = [];
    let currentTitle = '';
    let currentContent: string[] = [];

    for (const line of lines) {
        if (line.startsWith('# ')) {
            if (currentTitle) {
                sections.push({
                    id: slugify(currentTitle),
                    title: currentTitle,
                    content: currentContent.join('\n').trim(),
                });
            }
            currentTitle = line.replace(/^# /, '');
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    }

    if (currentTitle) {
        sections.push({
            id: slugify(currentTitle),
            title: currentTitle,
            content: currentContent.join('\n').trim(),
        });
    }

    return sections;
}

export const useInstructions = () => {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    
    const isClickScrolling = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const sections = useMemo(() => parseSections(markdown), [markdown]);

    useEffect(() => {
        fetch('/instruction.md')
            .then((r) => {
                if (!r.ok) throw new Error('Failed to load');
                return r.text();
            })
            .then((text) => {
                setMarkdown(text);
                const parsed = parseSections(text);
                if (parsed.length > 0) {
                    setActiveSection(parsed[0].id);
                }
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (isClickScrolling.current) return;

            const focusY = window.innerHeight * 0.3;
            let currentId = sections[0]?.id ?? '';

            for (const section of sections) {
                const el = document.getElementById(section.id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= focusY + 50) {
                        currentId = section.id;
                    }
                }
            }

            const isBottom =
                Math.ceil(window.innerHeight + window.scrollY) >=
                document.documentElement.scrollHeight - 10;
            if (isBottom && sections.length > 0) {
                currentId = sections[sections.length - 1].id;
            }

            setActiveSection((prev) => (prev !== currentId ? currentId : prev));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections]);

    const scrollToSection = useCallback((id: string, onScrollStart?: () => void) => {
        isClickScrolling.current = true;
        setActiveSection(id);
        
        if (onScrollStart) {
            onScrollStart();
        }

        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            
            scrollTimeoutRef.current = setTimeout(() => {
                isClickScrolling.current = false;
            }, 1000);
        }
    }, []);

    return { loading, error, activeSection, sections, scrollToSection };
};

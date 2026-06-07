import { type FC, type ReactNode, forwardRef } from "react";
import { FileDown, FileText, FileArchive, ExternalLink, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Publication } from "@/types/domain";

const SourceButton = forwardRef<
  HTMLButtonElement,
  {
    rightIcon: ReactNode;
    onClick?: () => void;
    asChild?: boolean;
    children?: ReactNode;
  }
>(({ rightIcon, asChild, children, ...rest }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    size="sm"
    className="h-9 w-full justify-center gap-2 rounded-lg border-slate-300 sm:w-auto"
    asChild={asChild}
    {...rest}
  >
    {asChild ? (
      children
    ) : (
      <>
        <FileDown className="size-4" />
        <span>Источник</span>
        {rightIcon}
      </>
    )}
  </Button>
));

SourceButton.displayName = "SourceButton";

function SourceButtonContent({ rightIcon }: { rightIcon: ReactNode }) {
  return (
    <>
      <FileDown className="size-4" />
      <span>Источник</span>
      {rightIcon}
    </>
  );
}

interface SourceFile {
  label: string;
  url: string;
  icon: typeof FileDown;
}

interface PublicationSourceFilesProps {
  publication: Publication;
}

const PublicationSourceFiles: FC<PublicationSourceFilesProps> = ({ publication }) => {
  const files: SourceFile[] = [
    ...(publication.pdf_file ? [{ label: "PDF", url: publication.pdf_file, icon: FileDown }] : []),
    ...(publication.bib_file ? [{ label: "BIB", url: publication.bib_file, icon: FileText }] : []),
    ...(publication.arj_file
      ? [{ label: "ARJ", url: publication.arj_file, icon: FileArchive }]
      : []),
  ];

  if (files.length === 0) {
    return (
      <SourceButton
        rightIcon={<X className="size-3.5 text-red-500" />}
        onClick={() => toast.error("Нет доступных источников")}
      />
    );
  }

  if (files.length === 1) {
    const file = files[0];
    return (
      <SourceButton rightIcon={<ExternalLink className="size-3.5 text-slate-400" />} asChild>
        <a href={file.url} target="_blank" rel="noopener noreferrer">
          <SourceButtonContent rightIcon={<ExternalLink className="size-3.5 text-slate-400" />} />
        </a>
      </SourceButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SourceButton rightIcon={<ChevronDown className="size-3.5 text-slate-400" />} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {files.map((file) => {
          const Icon = file.icon;
          return (
            <DropdownMenuItem key={file.label} asChild>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Icon className="size-4" />
                <span>{file.label}</span>
                <ExternalLink className="ml-auto size-3.5 shrink-0 text-slate-400" />
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PublicationSourceFiles;

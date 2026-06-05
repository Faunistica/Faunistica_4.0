import { type FC, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import {
  useGetPublicationByIdQuery,
  useGetSubmitStatusQuery,
  useSubmitPublicationMutation,
} from "@/api/publAPI";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
  MapPin,
  Hash,
  MessageSquare,
  Flower2,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/* ─── Schema ─── */

const submitFormSchema = z.object({
  processingLevel: z.enum(["full", "ural", "part", "skip"], {
    message: "Выберите уровень обработки",
  }),
  uralsScope: z.enum(["yes", "no"]).nullable(),
  materialStatus: z.enum(["yes", "no"]).nullable(),
  comment: z.string().max(1000, "Комментарий не длиннее 1000 символов").optional(),
});

type SubmitForm = z.infer<typeof submitFormSchema>;

const LEVEL_LABELS: Record<string, string> = {
  full: "Полная",
  ural: "Урал",
  part: "Частичная",
  skip: "Пропуск",
};

const LEVEL_DESC: Record<string, string> = {
  full: "Все виды определены до вида",
  ural: "Обработка ограничена Уралом",
  part: "Часть видов не определена",
  skip: "Публикация пропущена",
};

/* ─── Animations ─── */

const stagger = (i: number) => ({ delay: 0.05 * i });

const containerAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const itemAnim = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

/* ─── Main ─── */

const SubmitPublication: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const publ_id = Number(id);

  const { data: pub, isLoading: pubLoading } = useGetPublicationByIdQuery(publ_id);
  const { data: status, isLoading: statusLoading } = useGetSubmitStatusQuery(publ_id);
  const [submit, { isLoading: submitting }] = useSubmitPublicationMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SubmitForm>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: {
      processingLevel: undefined,
      uralsScope: null,
      materialStatus: null,
      comment: "",
    },
    mode: "onChange",
  });

  const processingLevel = watch("processingLevel");

  const onSubmit = useCallback(
    async (data: SubmitForm) => {
      const result = await submit({
        publ_id,
        data: {
          processing_level: data.processingLevel,
          urals_scope: data.uralsScope || null,
          material_status: data.materialStatus || null,
          comment: data.comment || null,
        },
      });
      if (!result.error) {
        toast.success("Публикация отмечена как обработанная");
        void navigate("/dashboard", { replace: true });
      }
    },
    [publ_id, submit, navigate],
  );

  if (pubLoading || statusLoading) return <LoadingScreen />;

  const draftIds = status?.draft_record_ids ?? [];
  const hasDrafts = draftIds.length > 0;
  const meta = pub ? [pub.author, pub.year?.toString(), pub.name].filter(Boolean).join(" — ") : "";

  return (
    <div className="py-6">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial="initial"
          animate="animate"
          variants={containerAnim}
          transition={{ duration: 0.35 }}
        >
          {/* Breadcrumb */}
          <a
            onClick={() => history.back()}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Назад
          </a>

          {hasDrafts ? (
            <DraftsBlock publ_id={publ_id} draftIds={draftIds} />
          ) : (
            <FormCard
              publ_id={publ_id}
              meta={meta}
              control={control}
              errors={errors}
              isValid={isValid}
              submitting={submitting}
              processingLevel={processingLevel}
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SubmitPublication;

/* ═══════════════════════════════════════════
   Form Card
   ═══════════════════════════════════════════ */

const FormCard: FC<{
  publ_id: number;
  meta: string;
  control: ReturnType<typeof useForm<SubmitForm>>["control"];
  errors: ReturnType<typeof useForm<SubmitForm>>["formState"]["errors"];
  isValid: boolean;
  submitting: boolean;
  processingLevel: string | undefined;
  handleSubmit: ReturnType<typeof useForm<SubmitForm>>["handleSubmit"];
  onSubmit: (data: SubmitForm) => Promise<void>;
}> = (p) => (
  <motion.div variants={containerAnim} initial="initial" animate="animate">
    <Card className="p-6 sm:p-8">
      <motion.div variants={itemAnim} transition={stagger(0)} className="mb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-border" />
          <Flower2 className="size-4 text-emerald-600" />
          <div className="h-px w-12 bg-border" />
        </div>
        <h1 className="text-2xl font-light tracking-wide sm:text-3xl">Завершение работы</h1>
        <p className="mt-1 text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
          Публикация #{p.publ_id}
        </p>
        {p.meta && <p className="mt-1 text-sm text-muted-foreground italic">{p.meta}</p>}
      </motion.div>

      <div className="space-y-7">
        {/* Processing level */}
        <motion.div variants={itemAnim} transition={stagger(1)}>
          <FieldLabel icon={FileText} text="Уровень обработки" />
          <Controller
            name="processingLevel"
            control={p.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  className={cn("w-full text-sm", !field.value && "text-muted-foreground")}
                >
                  <SelectValue placeholder="— выберите уровень —" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      <span>{label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{LEVEL_DESC[val]}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {p.errors.processingLevel && (
            <p className="mt-1 text-xs text-destructive">{p.errors.processingLevel.message}</p>
          )}
        </motion.div>

        {/* Urals scope */}
        <motion.div variants={itemAnim} transition={stagger(2)}>
          <FieldLabel icon={MapPin} text="Находки за пределами Урала?" />
          <Controller
            name="uralsScope"
            control={p.control}
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || null)}
                className="flex flex-col gap-2 sm:flex-row sm:gap-8"
              >
                {[
                  { val: "yes", label: "Да" },
                  { val: "no", label: "Нет" },
                ].map((opt) => (
                  <div key={opt.val} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.val} id={`urals-${opt.val}`} />
                    <Label
                      htmlFor={`urals-${opt.val}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        </motion.div>

        {/* Material status */}
        <motion.div variants={itemAnim} transition={stagger(3)}>
          <FieldLabel icon={Hash} text="Указания видов без материала?" />
          <Controller
            name="materialStatus"
            control={p.control}
            render={({ field }) => (
              <RadioGroup
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || null)}
                className="flex flex-col gap-2 sm:flex-row sm:gap-8"
              >
                {[
                  { val: "yes", label: "Да" },
                  { val: "no", label: "Нет" },
                ].map((opt) => (
                  <div key={opt.val} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.val} id={`mat-${opt.val}`} />
                    <Label
                      htmlFor={`mat-${opt.val}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        </motion.div>

        {/* Comment */}
        <motion.div variants={itemAnim} transition={stagger(4)}>
          <FieldLabel icon={MessageSquare} text="Комментарий" />
          <Controller
            name="comment"
            control={p.control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Любые замечания по публикации..."
                className="min-h-24 text-sm placeholder:text-sm placeholder:text-muted-foreground/40"
              />
            )}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        variants={itemAnim}
        transition={stagger(5)}
        className="mt-8 flex items-center justify-between border-t border-border pt-6"
      >
        <Button variant="outline" asChild>
          <Link to="/dashboard">Отмена</Link>
        </Button>
        <Button
          onClick={p.handleSubmit(p.onSubmit)}
          disabled={!p.isValid || p.submitting}
          className="bg-emerald-700 text-white hover:bg-emerald-800"
        >
          {p.submitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 size-4" />
          )}
          {p.submitting ? "Отправка..." : "Завершить"}
        </Button>
      </motion.div>
    </Card>
  </motion.div>
);

/* ═══════════════════════════════════════════
   Drafts Block
   ═══════════════════════════════════════════ */

const DraftsBlock: FC<{ publ_id: number; draftIds: string[] }> = ({ publ_id, draftIds }) => (
  <motion.div
    variants={containerAnim}
    initial="initial"
    animate="animate"
    className="rounded-xl border border-border p-1"
  >
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-3 flex items-center justify-center gap-3">
        <div className="h-px w-12 bg-border" />
        <Flower2 className="size-4 text-emerald-600" />
        <div className="h-px w-12 bg-border" />
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-2 font-semibold text-amber-700">
          <AlertCircle className="size-5 shrink-0" />
          <span>Завершение недоступно</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Есть {draftIds.length} {draftIds.length === 1 ? "черновая запись" : "черновых записей"},
          которые нужно отправить или удалить.
        </p>
        <ul className="mt-4 space-y-1.5">
          {draftIds.map((recordId) => (
            <li key={recordId}>
              <Link
                to={`/publication/${publ_id}/${recordId}`}
                className="text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
              >
                Запись {recordId.slice(0, 8)}…
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

const FieldLabel: FC<{ icon: typeof FileText; text: string }> = ({ icon: Icon, text }) => (
  <div className="mb-2 flex items-center gap-2">
    <Icon className="size-3.5 text-emerald-600" />
    <span className="text-sm text-foreground">{text}</span>
  </div>
);

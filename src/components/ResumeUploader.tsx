import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/hooks/useResumeText";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

const ResumeUploader = () => {
  const [uploading, setUploading] = useState(false);
  const { fileName, setResume } = useResumeStore();
  const { t } = useLanguage();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("uploader.tooLarge"));
      return;
    }

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { fileBase64, fileName: file.name, jobTitle: "通用", extractOnly: true },
      });

      if (error) throw error;

      const resumeText = data?.optimizedContent || `Resume: ${file.name}`;
      setResume(resumeText, file.name);
      toast.success(t("uploader.success"));
    } catch (err: any) {
      toast.error(err.message || t("uploader.failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-5 w-5" />
          {t("uploader.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="global-resume-upload"
            disabled={uploading}
          />
          <label htmlFor="global-resume-upload" className="cursor-pointer">
            {fileName ? (
              <>
                <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                <p className="mt-2 text-sm font-medium">{fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("uploader.reupload")}</p>
              </>
            ) : (
              <>
                <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  {uploading ? t("uploader.uploading") : t("uploader.click")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("uploader.formats")}</p>
              </>
            )}
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeUploader;

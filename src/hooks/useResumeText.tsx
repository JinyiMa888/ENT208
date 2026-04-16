import { create } from "zustand";

interface ResumeStore {
  resumeText: string;
  fileName: string;
  setResume: (text: string, name: string) => void;
  clear: () => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resumeText: "",
  fileName: "",
  setResume: (text, name) => set({ resumeText: text, fileName: name }),
  clear: () => set({ resumeText: "", fileName: "" }),
}));

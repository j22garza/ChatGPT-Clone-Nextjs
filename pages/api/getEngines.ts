import { MODEL_OPTIONS } from "@/app/utils/llmProviders";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ modelOption: [] });
  }
  return res.status(200).json({
    modelOption: MODEL_OPTIONS,
  });
}

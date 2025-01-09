import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Upload, X, Loader2 } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { generatePdfChat } from "../services/groq";
import ReactMarkdown from "react-markdown";
import "pdfjs-dist/build/pdf.worker.mjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

// Set worker path
//@ts-ignore
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PdfChat() {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfText, setPdfText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedPdfContent = sessionStorage.getItem("pdfContent");
    const storedPdfUrl = sessionStorage.getItem("pdfUrl");
    const storedPdfName = sessionStorage.getItem("pdfName");

    if (storedPdfContent && storedPdfUrl) {
      setPdfText(storedPdfContent);
      setPdfUrl(storedPdfUrl);
      sessionStorage.removeItem("pdfContent");
      sessionStorage.removeItem("pdfUrl");
      sessionStorage.removeItem("pdfName");
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected. Please try again.",
        variant: "destructive",
      });
      return;
    }
    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Please upload a valid PDF file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + " ";
      }

      setPdfText(fullText);
      await pdf.destroy();

      toast({
        title: "Success",
        description:
          "PDF uploaded successfully. You can now ask questions about its content.",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "PDF uploaded successfully. You can now ask questions about its content.",
        },
      ]);
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        title: "Error",
        description: "Error processing PDF. Please try uploading again.",
        variant: "destructive",
      });
      setPdfUrl("");
      setPdfText("");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !pdfText) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await generatePdfChat(pdfText, userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <MessageSquare className="mx-auto h-16 w-16 text-primary" />
          <h2 className="mt-2 text-4xl font-bold text-primary">
            Chat with PDF
          </h2>
          <p className="mt-2 text-xl text-muted-foreground">
            Upload a PDF and ask questions about its content
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* PDF Preview */}
          <Card className="lg:w-1/2 bg-gray-100">
            <CardContent className="p-6">
              {!pdfUrl ? (
                <div className="flex flex-col items-center justify-center min-h-[600px]">
                  <Upload className="h-16 w-16 text-black mb-4" />
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-4"
                    onClick={handleUploadClick}
                    disabled={uploading}
                  >
                    {uploading ? "Processing..." : "Upload PDF"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </div>
              ) : (
                <div className="h-[600px]">
                  {uploading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full rounded-md"
                      title="PDF Preview"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="lg:w-1/2 flex flex-col h-[700px] bg-gray-100">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <ReactMarkdown
                            className="prose prose-sm max-w-none dark:prose-invert"
                            components={{
                              strong: ({ node, ...props }) => (
                                <span className="font-semibold" {...props} />
                              ),
                              blockquote: ({ node, ...props }) => (
                                <blockquote
                                  className="border-l-4 border-primary pl-4 italic"
                                  {...props}
                                />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc pl-4 space-y-1"
                                  {...props}
                                />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3
                                  className="text-lg font-semibold mt-2 mb-1"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <form onSubmit={handleSubmit} className="flex gap-2 mt-4 p-4">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    pdfText ? "Ask a question..." : "Upload a PDF first"
                  }
                  disabled={!pdfText || loading}
                />
                <Button type="submit" disabled={!pdfText || loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

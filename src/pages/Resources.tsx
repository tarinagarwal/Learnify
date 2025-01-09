import React, { useState, useEffect } from "react";
import {
  Book,
  Upload,
  Download,
  X,
  MessageSquare,
  Brain,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { generatePdfThumbnail } from "../utils/pdfThumbnail";
import { useNavigate } from "react-router-dom";
import { extractTextFromPdf } from "../utils/pdfExtractor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Resource {
  id: string;
  name: string;
  description: string;
  file_url: string;
  thumbnail_url: string | null;
  created_at: string;
  user_id: string;
}

export default function Resources() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null as File | null,
    thumbnail: null as File | null,
  });

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    resources.forEach(async (resource) => {
      if (!resource.thumbnail_url && !thumbnails[resource.id]) {
        try {
          const thumbnail = await generatePdfThumbnail(resource.file_url);
          setThumbnails((prev) => ({
            ...prev,
            [resource.id]: thumbnail,
          }));
        } catch (error) {
          console.error("Error generating thumbnail:", error);
        }
      }
    });
  }, [resources]);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setResources(data);
    }
    setLoading(false);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "file" | "thumbnail"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "file" && !file.type.includes("pdf")) {
        alert("Only PDF files are allowed");
        return;
      }
      if (type === "thumbnail" && !file.type.includes("image")) {
        alert("Only image files are allowed for thumbnails");
        return;
      }
      setFormData({ ...formData, [type]: file });
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("resources")
      .upload(path, file);

    if (error) throw error;
    return supabase.storage.from("resources").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;

    try {
      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const fileUrl = await uploadFile(
        formData.file,
        `${user.id}/${Date.now()}-${formData.file.name}`
      );

      let thumbnailUrl = null;
      if (formData.thumbnail) {
        thumbnailUrl = await uploadFile(
          formData.thumbnail,
          `${user.id}/thumbnails/${formData.thumbnail.name}`
        );
      }

      const { data, error } = await supabase.from("resources").insert([
        {
          name: formData.name,
          description: formData.description,
          file_url: fileUrl,
          thumbnail_url: thumbnailUrl,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      setFormData({ name: "", description: "", file: null, thumbnail: null });
      setShowForm(false);
      fetchResources();
    } catch (error) {
      console.error("Error uploading resource:", error);
      alert("Error uploading resource. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handlePdfAction = async (
    resource: Resource,
    action: "chat" | "quiz"
  ) => {
    try {
      const response = await fetch(resource.file_url);
      const blob = await response.blob();
      const file = new File([blob], resource.name, { type: "application/pdf" });

      const pdfText = await extractTextFromPdf(file);

      sessionStorage.setItem("pdfContent", pdfText);
      sessionStorage.setItem("pdfName", resource.name);
      sessionStorage.setItem("pdfUrl", resource.file_url);

      navigate(action === "chat" ? "/pdf-chat" : "/quiz");
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Error processing PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-xl text-primary">
            Loading Resources...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Book className="mx-auto h-16 w-16 text-primary" />
          <h2 className="mt-2 text-4xl font-bold text-primary">
            Learning Resources
          </h2>
          <p className="mt-2 text-xl text-muted-foreground">
            Explore and share educational materials to enhance your learning
            journey
          </p>
        </div>

        <div className="text-center mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Resource</DialogTitle>
                <DialogDescription>
                  Share your knowledge by uploading a PDF resource.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="file">PDF File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) => handleFileChange(e, "file")}
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnail">Thumbnail (optional)</Label>
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "thumbnail")}
                  />
                </div>
                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="bg-gray-100">
              <CardHeader>
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  {resource.thumbnail_url ? (
                    <img
                      src={resource.thumbnail_url}
                      alt={resource.name}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  ) : thumbnails[resource.id] ? (
                    <img
                      src={thumbnails[resource.id]}
                      alt={resource.name}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center rounded-md">
                      <Book className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardTitle>{resource.name}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    <Button
                      onClick={() => handlePdfAction(resource, "chat")}
                      className="flex-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat with PDF
                    </Button>
                    <Button
                      onClick={() => handlePdfAction(resource, "quiz")}
                      className="flex-1"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Quiz
                    </Button>
                  </div>
                  <Button variant="outline" asChild className="w-full">
                    <a
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

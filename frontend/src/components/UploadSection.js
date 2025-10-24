import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UploadSection({ onSuccess, agents }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [".csv", ".xlsx", ".xls"];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf("."));
      
      if (validTypes.includes(fileExtension.toLowerCase())) {
        setFile(selectedFile);
      } else {
        toast.error("Please upload a CSV, XLSX, or XLS file");
        e.target.value = null;
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    if (agents.length === 0) {
      toast.error("Please add agents before uploading files");
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API}/uploads`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        `File uploaded! ${response.data.total_records} records distributed among ${response.data.agents_count} agents`
      );
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk' }}>Upload & Distribute</CardTitle>
          <CardDescription>Upload a CSV or Excel file to distribute among agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Required File Format</h4>
                <p className="text-sm text-blue-700 mb-2">Your file must contain the following columns:</p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li><strong>FirstName</strong> - Text field</li>
                  <li><strong>Phone</strong> - Number field</li>
                  <li><strong>Notes</strong> - Text field</li>
                </ul>
                <p className="text-sm text-blue-700 mt-2">Accepted formats: CSV, XLSX, XLS</p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="file-upload"
              data-testid="file-input"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-2">
                {file ? file.name : "Choose a file or drag it here"}
              </p>
              <p className="text-sm text-slate-500">CSV, XLSX, or XLS up to 10MB</p>
            </label>
          </div>

          {file && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{file.name}</p>
                  <p className="text-sm text-green-700">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading || agents.length === 0}
            data-testid="upload-button"
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload and Distribute
              </>
            )}
          </Button>

          {agents.length === 0 && (
            <p className="text-sm text-amber-600 text-center">
              ⚠️ Please add agents before uploading files
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
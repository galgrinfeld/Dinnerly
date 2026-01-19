import React from "react";
import ReactQuill from "react-quill";
import { Box } from "@mui/material";

interface RichTextEditorProps {
  value: string;
  onChange: (nextHtml: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
}) => {
  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = ["bold", "italic", "underline", "list", "bullet", "link"];

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        padding: 0,
        overflow: "hidden",
        "& .ql-container": {
          minHeight: "160px",
          fontSize: "0.95rem",
          fontFamily: "inherit",
        },
        "& .ql-editor": {
          padding: "12px",
        },
        "& .ql-toolbar": {
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "#fafafa",
        },
        "&:focus-within": {
          borderColor: "primary.main",
          boxShadow: "0 0 0 2px rgba(25, 103, 210, 0.1)",
        },
      }}
    >
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        theme="snow"
        placeholder={placeholder}
      />
    </Box>
  );
};

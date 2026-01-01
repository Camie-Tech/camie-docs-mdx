// src/components/mdx/index.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Check, Info, AlertTriangle, XCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Custom Alert Component
export const CalloutAlert = ({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
}) => {
  const config = {
    info: { icon: Info, className: "border-blue-200 bg-blue-50 text-blue-900" },
    warning: {
      icon: AlertTriangle,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    },
    error: {
      icon: XCircle,
      className: "border-red-200 bg-red-50 text-red-900",
    },
    success: {
      icon: Check,
      className: "border-green-200 bg-green-50 text-green-900",
    },
  };

  const { icon: Icon, className } = config[type];

  return (
    <Alert className={`my-4 ${className}`}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
};

// Enhanced Code Block
export const CodeBlock = ({
  language,
  title,
  children,
}: {
  language?: string;
  title?: string;
  children: string;
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="my-4">
      {(title || language) && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {title && <CardTitle className="text-sm">{title}</CardTitle>}
              {language && <Badge variant="secondary">{language}</Badge>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyCode}
              className="h-6 w-6 p-0"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <pre className="bg-gray-950 text-gray-50 p-4 rounded-b-lg overflow-x-auto">
          <code>{children}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

// API Reference Component
export const ApiReference = ({
  endpoint,
  method,
  description,
  parameters,
  example,
}: {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  example?: string;
}) => {
  const methodColors = {
    GET: "bg-green-100 text-green-800",
    POST: "bg-blue-100 text-blue-800",
    PUT: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
  };

  return (
    <Card className="my-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge className={methodColors[method]}>{method}</Badge>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
            {endpoint}
          </code>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {parameters && (
          <div className="space-y-4">
            <h4 className="font-semibold">Parameters</h4>
            <div className="space-y-2">
              {parameters.map((param) => (
                <div
                  key={param.name}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded"
                >
                  <code className="text-sm font-medium">{param.name}</code>
                  <Badge
                    variant={param.required ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {param.type}
                  </Badge>
                  <span className="text-sm text-gray-600 flex-1">
                    {param.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {example && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Example</h4>
            <CodeBlock language="json">{example}</CodeBlock>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Step-by-step guide component
export const Steps = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="space-y-4 my-6">
      {React.Children.map(children, (child, index) => (
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            {index + 1}
          </div>
          <div className="flex-1 pt-1">{child}</div>
        </div>
      ))}
    </div>
  );
};

export const Step = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

// Feature grid component
export const FeatureGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">{children}</div>
  );
};

export const Feature = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon && <div className="text-blue-600">{icon}</div>}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

// Export all components for MDX
export const mdxComponents = {
  // ShadCN components
  Button,
  Badge,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,

  // Custom components
  Alert: CalloutAlert,
  CodeBlock,
  ApiReference,
  Steps,
  Step,
  FeatureGrid,
  Feature,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,

  // Enhanced HTML elements
  h1: ({ children, ...props }: any) => (
    <h1 className="text-4xl font-bold mb-6 pb-2 border-b" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-3xl font-semibold mb-4 mt-8" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-2xl font-medium mb-3 mt-6" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="mb-4 leading-7" {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="text-blue-600 hover:text-blue-800 underline underline-offset-4"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600"
      {...props}
    >
      {children}
    </blockquote>
  ),
};

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';

export default function Export() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
            <Download className="h-6 w-6" />
            Export Data
          </h1>
          <p className="text-muted-foreground text-sm">
            Download archive data for external analysis
          </p>
        </div>

        {/* Export Options */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <FileJson className="h-5 w-5 text-terminal-cyan" />
                JSON Export
              </CardTitle>
              <CardDescription>
                Full-fidelity export with all metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start font-mono" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Posts (0 records)
                </Button>
                <Button variant="outline" className="w-full justify-start font-mono" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Agents (0 records)
                </Button>
                <Button variant="outline" className="w-full justify-start font-mono" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Comments (0 records)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                CSV Export
              </CardTitle>
              <CardDescription>
                Spreadsheet-compatible format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start font-mono" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Posts (0 records)
                </Button>
                <Button variant="outline" className="w-full justify-start font-mono" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Agents (0 records)
                </Button>
                <Button variant="outline" className="w-full justify-start font-mono" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export Comments (0 records)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Download className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-mono text-lg font-medium mb-2">No Data to Export</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Collect data from Moltbook first, then return here to export
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

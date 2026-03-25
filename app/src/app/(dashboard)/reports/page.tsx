import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export default async function ReportsPage() {
  const session = await auth();
  const user = session?.user as { id: string; orgId?: string; name?: string; email?: string };

  const reportTypes = [
    {
      id: "weekly",
      title: "週次レポート",
      description: "投稿数・エンゲージ・フォロワー増減・トップ投稿",
      formats: ["PDF", "CSV"],
    },
    {
      id: "monthly",
      title: "月次レポート",
      description: "KPIトレンド・アカウント比較・担当者別実績",
      formats: ["PDF", "CSV", "Excel"],
    },
    {
      id: "campaign",
      title: "キャンペーンレポート",
      description: "予算消化・ROI・投稿別成果・前回比較",
      formats: ["PDF", "Excel"],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="レポート出力"
        userName={user.name ?? undefined}
        userEmail={user.email ?? undefined}
      />
      <div className="p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-gray-600">{report.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {report.formats.map((fmt) => (
                    <Button
                      key={fmt}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 gap-1"
                    >
                      <Download className="h-3 w-3" />
                      {fmt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">レポート出力オプション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">対象期間</label>
                <input type="date" className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">終了日</label>
                <input type="date" className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <div className="flex items-end">
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  レポート生成
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

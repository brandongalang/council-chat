import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, MessageSquare, Zap } from "lucide-react"

export default function Page() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero */}
      <section className="space-y-2">
        <h1 className="text-4xl font-sans font-medium tracking-tight text-primary">
          Operational Overview
        </h1>
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
          / System Status: Nominal
        </p>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium uppercase tracking-wider">
              Active Sessions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-sans font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              +2 from last cycle
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium uppercase tracking-wider">
              Token Usage
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-sans font-bold text-foreground">48k</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Within allocated budget
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium uppercase tracking-wider">
              Uptime
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-sans font-bold text-foreground">99.9%</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              System stable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area: Recent Transmissions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border">
          <CardHeader>
            <CardTitle className="font-sans text-xl">Recent Transmissions</CardTitle>
            <CardDescription className="font-mono text-xs">
              Latest council deliberations and synthesis reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border/50 bg-background/50 hover:bg-accent/10 hover:border-accent/50 transition-colors cursor-pointer group">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none font-sans group-hover:text-primary transition-colors">
                      Protocol Alpha-{i}0{i}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Start time: 14:0{i} UTC
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono text-muted-foreground px-2 py-1 bg-secondary/50 rounded-none">
                      Analyzing
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="font-sans text-xl text-primary-foreground">Quick Access</CardTitle>
            <CardDescription className="font-mono text-xs text-primary-foreground/70">
              Initiate new protocols.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" className="w-full justify-between font-mono rounded-none h-12 hover:bg-background hover:text-foreground transition-colors">
              New Chat Session
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between font-mono rounded-none h-12 bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors">
              Manage Agents
              <Settings2 className="h-4 w-4" />
            </Button>
            <div className="mt-4 pt-4 border-t border-primary-foreground/10">
              <p className="text-xs font-mono text-primary-foreground/60">
                System Note: All sessions are automatically archived for compliance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Import Settings2 locally since it wasn't in the top import
import { Settings2 } from "lucide-react"

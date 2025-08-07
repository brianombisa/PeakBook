import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  bgGradient,
  linkTo,
  trendText
}) {
  const CardContentComponent = (
    <Card className="group overflow-hidden glass-effect card-hover border-0 shadow-xl h-full">
      <CardContent className="p-0 flex flex-col justify-between h-full">
        {/* Gradient Header */}
        <div className={`bg-gradient-to-br ${bgGradient} p-6 text-white relative overflow-hidden`}>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8 transition-transform group-hover:scale-125"></div>
          <div className="absolute top-1/2 right-4 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-white/90 text-sm font-semibold mb-3 tracking-wide uppercase">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <Icon className="w-7 h-7" />
            </div>
          </div>
        </div>
        
        {/* Trend Section */}
        {trend && (
          <div className="p-5 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${trendUp ? 'bg-green-100' : 'bg-red-100'}`}>
                  {trendUp ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <span className={`font-bold text-lg ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trend}
                  </span>
                  <p className="text-xs text-slate-500 font-medium">{trendText || "vs prior period"}</p>
                </div>
              </div>
              {linkTo && (
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="no-underline block transform transition-transform hover:scale-[1.02]">
        {CardContentComponent}
      </Link>
    );
  }
  
  return CardContentComponent;
}
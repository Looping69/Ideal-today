
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SearchFilterBar() {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-full border border-gray-200 shadow-lg flex items-center p-2 pl-6 mb-8">
      <div className="flex-1 flex flex-col justify-center cursor-pointer hover:bg-gray-100 rounded-full px-4 py-2 transition-colors">
        <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">Where</label>
        <input 
          type="text" 
          placeholder="Search destinations" 
          className="text-sm text-gray-600 bg-transparent border-none outline-none placeholder:text-gray-400 w-full"
        />
      </div>
      
      <Separator orientation="vertical" className="h-8" />
      
      <div className="flex-1 flex flex-col justify-center cursor-pointer hover:bg-gray-100 rounded-full px-4 py-2 transition-colors">
        <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">Check in</label>
        <div className="text-sm text-gray-400">Add dates</div>
      </div>
      
      <Separator orientation="vertical" className="h-8" />
      
      <div className="flex-1 flex flex-col justify-center cursor-pointer hover:bg-gray-100 rounded-full px-4 py-2 transition-colors">
        <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">Check out</label>
        <div className="text-sm text-gray-400">Add dates</div>
      </div>
      
      <Separator orientation="vertical" className="h-8" />
      
      <div className="flex-[1.2] flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded-full pl-4 pr-2 py-2 transition-colors">
        <div className="flex flex-col justify-center">
          <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">Who</label>
          <div className="text-sm text-gray-400">Add guests</div>
        </div>
        <Button size="icon" className="rounded-full bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90 h-12 w-12 shrink-0">
          <Search className="w-5 h-5 text-white" />
        </Button>
      </div>
    </div>
  );
}

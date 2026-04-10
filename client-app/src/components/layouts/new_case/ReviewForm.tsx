// import React from "react";
import { Sparkles, FileText, Clock, Scale, Users } from "lucide-react";

const ReviewForm = () => {
  return (
    <>
      <div className="/bg-black/10 pt-10 pb-6 flex flex-col items-center">
        <div className="rounded-full aspect-square p-4 flex justify-center items-center mb-4 bg-mist-300/60">
          <Sparkles className="w-7 h-7 text-black" />
        </div>
        <h2 className="text-lg font-semibold">Generate your case workspace</h2>
        <p className="text-gray-600 text-center mt-1 text-xs">
          We'll organize your case into facts, timeline, issues, and arguments
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs mt-8">
          <div className="text-gray-600 w-44 h-10 flex px-3 justify-start items-center border border-black/15 rounded-lg">
            <FileText className="w-4 h-4 mr-2" />
            Facts & Evidence
          </div>
          <div className="text-gray-600 w-44 h-10 flex px-3 justify-start items-center border border-black/15 rounded-lg">
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </div>
          <div className="text-gray-600 w-44 h-10 flex px-3 justify-start items-center border border-black/15 rounded-lg">
            <Scale className="w-4 h-4 mr-2" />
            Legal Issues
          </div>
          <div className="text-gray-600 w-44 h-10 flex px-3 justify-start items-center border border-black/15 rounded-lg">
            <Users className="w-4 h-4 mr-2" />
            Arguments
          </div>
        </div>
      </div>
    </>
  );
};
export default ReviewForm;

// import React from "react";
import {
  Sparkles,
  FileText,
  Clock,
  Scale,
  Users,
  BriefcaseBusiness,
} from "lucide-react";

const ReviewForm = () => {
  return (
    <>
      <div className="/bg-black/10 pt-10 pb-6 flex flex-col items-center">
        <div className="mb-4 flex aspect-square items-center justify-center rounded-full border border-black/10 bg-black/6 p-4">
          <Sparkles className="w-7 h-7 text-black/75" />
        </div>
        <h2 className="text-xl font-semibold">Generate case graph</h2>
        <p className="text-gray-600 text-center mt-1 text-sm">
          We'll organize your case into facts, timeline, issues, and arguments.
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm mt-8">
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

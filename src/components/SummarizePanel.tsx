import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";

import { storageManager } from "../storage";

import TreeCollapse from "@spectrum-icons/workflow/TreeCollapse";
import TreeExpand from "@spectrum-icons/workflow/TreeExpand";

const SummarizePanel = () => {
  const [expandContents, setExpandContents] = useState(false);
  useEffect(() => {});

  const titleStyle = expandContents ? "border-b-2 mb-2" : "";
  return (
    <div className="panel m-1 px-2 py-2 rounded-md bg-primary text-primary-foreground">
      <div className={`flex items-center ${titleStyle}`}>
        <span className="text-md font-medium">Summarize</span>
        <div className="ml-auto">
          <span className="corner-button">
            <Button size="icon" onPress={() => setExpandContents((s) => !s)}>
              {expandContents ? <TreeCollapse /> : <TreeExpand />}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummarizePanel;

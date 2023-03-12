import { EventEmitter } from '@jeli/core';

Element({
    selector: "fo-tree",
    props: ["treeData", "initialSelection", "icons", "expandLevel"],
    events: [
        "onSelect:emitter"
    ],
    templateUrl: './fo-tree-element.html',
    styleUrl: './fo-tree-element.scss'
})
export function FoTreeElement() {
    this.onSelect = new EventEmitter();
    this.icons = {
        iconExpand: 'bi bi-folder',
        iconCollapse: 'bi bi-folder2-open',
        iconLeaf: 'bi bi-file-code'
    };
    this.expandLevel = 3;
    this.currentSelection = null;

    this.onBranchSelected = function(branch) {
        if (this.currentSelection !== branch || branch.isDir) {
            this._branchSelected(branch)
        }
    };

    this.trackByFn = function(item) {
        return item.uid;
    }

    this.didInit = function() {
        var _this = this;
        if (this.initialSelection) {
            this.forEach(function(branch) {
                if (branch.name === _this.initialSelection) {
                    return _this._branchSelected(branch);
                }
            });
        }
    };

    Object.defineProperty(this, 'treeData', {
        set: function(value) {
            this._treeData = value;
            this._onTreeDataChanged();
        }
    })
}

FoTreeElement.prototype._branchSelected = function(branch) {
    if (!branch) {
        if (this.currentSelection != null) {
            this.currentSelection.selected = false;
        }
        this.currentSelection = null;
        return;
    }

    if (this.currentSelection != null) {
        this.currentSelection.selected = false;
    }
    branch.selected = true;
    branch.expanded = !branch.expanded;
    this.currentSelection = branch;
    this.expandParents(branch);
    this.onSelect.emit(branch);
}

FoTreeElement.prototype.expandParents = function(child) {
    this.forAllAncestors(child, function(b) {
        return b.expanded = true;
    });
}

FoTreeElement.prototype.forAllAncestors = function(child, callback) {
    var parent = this.getParent(child);
    if (parent != null) {
        callback(parent);
        return this.forAllAncestors(parent, callback);
    }
}

FoTreeElement.prototype.getParent = function(child) {
    return this.tree_rows[child.parentIndex];
}

FoTreeElement.prototype._forEachBranch = function(callback) {
    for (var i = 0, len = this.tree_rows.length; i < len; i++) {
        callback(this.tree_rows[i]);
    }
}

FoTreeElement.prototype.forEach = function(callback) {
    this._forEachBranch(function(branch) {
        performTask(branch, 1);
    });

    function performTask(branch, level) {
        callback(branch, level);
        if (branch.children != null) {
            var childRef = branch.children;
            for (var i = 0, len = childRef.length; i < len; i++) {
                performTask(childRef[i], level + 1);
            }
        }
    }
}

FoTreeElement.prototype._onTreeDataChanged = function() {
    this.tree_rows = [];
    var _this = this;
    for (var i = 0; i < this._treeData.length; i++) {
        runTask(this._treeData[i], 1, true);
    }

    /**
     * 
     * @param {*} branch 
     * @param {*} level 
     * @param {*} visible 
     * @param {*} treeIndex 
     */
    function runTask(branch, level, visible) {
        branch.level = level;
        if (branch.expanded === undefined) {
            branch.expanded = level < _this.expandLevel;
        }

        if (!branch.uid) {
            branch.uid = "" + Math.random();
        }
        branch.visible = visible;
        /**
         * add the child to the display list
         */
        addToList(branch);
        /**
         * run nested children;
         */
        runChildren(branch);
    }

    function runChildren(branch) {
        if (Array.isArray(branch.children) && branch.children.length) {
            for (var i = 0, len = branch.children.length; i < len; i++) {
                if (typeof branch.children[i] === 'string') {
                    branch.children[i] = {
                        name: branch.children[i],
                        children: []
                    };
                }
                var child = branch.children[i];
                child.parentIndex = branch.treeIndex;
                runTask(child, branch.level + 1, branch.expanded);
            }
        } else {
            branch.children = [];
        }
    }

    /**
     * 
     * @param {*} branch 
     */
    function addToList(branch) {
        branch.expanded = branch.expanded;
        branch.classes = branch.classes || [];
        if (!branch.noLeaf && !branch.isDir) {
            branch.treeIcon = _this.icons.iconLeaf;
            if (!branch.classes.includes('leaf')) {
                branch.classes.push("leaf");
            }
        } else {
            branch.treeIcon = _this.icons[branch.expanded ? 'iconCollapse' : 'iconExpand'];
        }

        branch.treeIndex = _this.tree_rows.length;
        _this.tree_rows.push(branch);
    }
}
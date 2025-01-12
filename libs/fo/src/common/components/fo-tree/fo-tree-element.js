import { EventEmitter } from '@jeli/core';

Element({
    selector: "fo-tree",
    props: ["treeData", "initialSelection", "icons", "expandLevel"],
    events: [
        "onSelect:emitter",
        "onMove:emitter"
    ],
    DI: ['changeDetector?'],
    templateUrl: './fo-tree-element.html',
    styleUrl: './fo-tree-element.scss'
})
export class FoTreeElement {
    constructor(changeDetector) {
        this.changeDetector = changeDetector;
        this.onSelect = new EventEmitter();
        this.onMove = new EventEmitter();
        this.icons = {
            iconExpand: 'bi bi-folder',
            iconCollapse: 'bi bi-folder2-open',
            iconLeaf: 'bi bi-file-code'
        };
        this.expandLevel = 3;
        this.currentSelection = null;

        Object.defineProperty(this, 'treeData', {
            set: function (value) {
                this._treeData = value;
                this._onTreeDataChanged();
            }
        });
    }

    onBranchSelected(branch) {
        if (this.currentSelection !== branch || branch.isDir) {
            this._branchSelected(branch);
        }
    }

    trackByFn(item) {
        return item.uid;
    }

    didInit() {
        if (this.initialSelection) {
            this.forEach((branch) => {
                if (branch.name === this.initialSelection) {
                    return this._branchSelected(branch);
                }
            });
        }
    }

    _branchSelected(branch) {
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
        this.changeDetector.onlySelf();
    }
    
    expandParents(child) {
        this.forAllAncestors(child, function (b) {
            return b.expanded = true;
        });
    }
    forAllAncestors(child, callback) {
        var parent = this.getParent(child);
        if (parent != null) {
            callback(parent);
            return this.forAllAncestors(parent, callback);
        }
    }
    getParent(child) {
        return this.tree_rows[child.parentIndex];
    }
    _forEachBranch(callback) {
        for (var i = 0, len = this.tree_rows.length; i < len; i++) {
            callback(this.tree_rows[i]);
        }
    }
    forEach(callback) {
        this._forEachBranch(function (branch) {
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
    _onTreeDataChanged() {
        this.tree_rows = [];
        /**
         *
         * @param {*} branch
         */
        var addToList = (branch) => {
            branch.expanded = branch.expanded;
            branch.classes = branch.classes || [];
            if (!branch.noLeaf && !branch.isDir) {
                branch.treeIcon = this.icons.iconLeaf;
                if (!branch.classes.includes('leaf')) {
                    branch.classes.push("leaf");
                }
            } else {
                branch.treeIcon = this.icons[branch.expanded ? 'iconCollapse' : 'iconExpand'];
            }

            branch.treeIndex = this.tree_rows.length;
            this.tree_rows.push(branch);
        };

        /**
         *
         * @param {*} branch
         * @param {*} level
         * @param {*} visible
         * @param {*} treeIndex
         */
        var runTask = (branch, level, visible) => {
            branch.level = level;
            if (branch.expanded === undefined) {
                branch.expanded = level < this.expandLevel;
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
        };

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

        for (var i = 0; i < this._treeData.length; i++) {
            runTask(this._treeData[i], 1, true);
        }
    }

    onDragDrop(event, parent){
        var child = JSON.parse(event.dataTransfer.getData('application/json'));
        if (child)
            this.onMove.emit({parent, child});
    }

    onDragOver(event){
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    onDragStart(event, row){
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData('text/plain', event.target.id);
        event.dataTransfer.setData('application/json', JSON.stringify(row));
    }
}
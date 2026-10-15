import { ConversionPipe } from "./conversion.pipe";
import { JsonXPipe } from "./json-pipe.pipe";

jModule({
    services:[
        JsonXPipe,
        ConversionPipe 
    ]
})
export class FilterModule{
    
}
const applyEntityTransform = (values, rsc, solr) => {
    if (!values) {
        return values;
    }
    let data,
        new_data = [],
        restapi,
        resAsArray,
        new_val;
    restapi = values.data || values.results;
    let rest_vals_arr = values.data || values.results;
    resAsArray =
        values instanceof Array || rest_vals_arr instanceof Array ? true : false;

    data = rest_vals_arr || values;
    if (!(data instanceof Array)) {
        data = [data];
    }

    data.map((res) => {
        new_val = res;
        if (solr) {
            new_val = res;
        } else if (restapi && !rsc) {
            // logic
        } else {
            // logic
        }
        new_data.push(new_val);
    });
    return resAsArray ? new_data : new_data[0];
};

const fetchAPIRequestData = async (
    url,
    query,
    opts,
    pageLimit,
    pageOffset
) =>
    new Promise((resolve) => {
        opts = opts || { type: 'tld' };
        query = query || {};

        const pref = opts?.type || false;
        const auth = opts?.auth || false;

        if (pageLimit && pageLimit > 0 && (!pref || !pref.includes('solr'))) {
            query = { ...query, 'page[limit]': pageLimit };
        }
        if (pageOffset && (!pref || !pref.includes('solr'))) {
            query = { ...query, 'page[offset]': pageOffset };
        }

        request(pref, false, auth)
            .get(url)
            .query(query)
            .ok((resp) => {
                if (resp.unauthorized || resp.forbidden || resp.clientError) {
                    console.error(resp.error);
                }
                return resp.statusCode;
            })
            .then((response) => {
                let new_data;
                new_data =
                    pref && pref.includes('solr')
                        ? applyEntityTransform(response.body, false, true)
                        : applyEntityTransform(response.body);

                resolve({
                    page_data: response.statusCode === 200 ? new_data : {},
                    statusCode: response.statusCode,
                    ttlResults: response.body?.meta?.count
                        ? parseInt(response.body.meta.count)
                        : false,
                    ttlPages:
                        pageLimit && pageLimit > 0 && response.body?.meta?.count
                            ? Math.ceil(
                                parseInt(response.body.meta.count) / parseInt(pageLimit)
                            )
                            : false,
                });
            })
            .catch((error) => {
                console.error('fetchAPIRequestData. Could not fetch page data.', error);
            });
    });

const getIndividualPageData = async (url, query) => {
    query = query || {};
    let q = {};

    if (url.includes('/pages')) {
        q = {
            include: 'image,image.imageFile',
            'fields[images]': 'imageFile,caption',
            'fields[files]': 'uri',
            ...query,
        };
    } else if (url.includes('/persons')) {
        q = {
            include: 'image,image.imageFile,topic',
            'fields[images]': 'imageFile,caption',
            'fields[files]': 'uri',
            ...query,
        };
    }
    const res = await fetchAPIRequestData(url, q);
    return res;
}